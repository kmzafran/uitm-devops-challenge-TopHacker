import re
import scrapy
from datetime import datetime, timezone

from fazwaz_propertyrent.items import FazwazPropertyrentItem
from fazwaz_propertyrent.params import build_start_urls


class FazwazRentSpider(scrapy.Spider):
    name = 'fazwazrent'
    allowed_domains = ['fazwaz.my', 'www.fazwaz.my']

    def __init__(self, region=None, property_type=None, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.start_urls = build_start_urls(region, property_type)
        self.crawl_started_at = datetime.now(timezone.utc).isoformat()
        self.logger.info(f'Starting URLs: {self.start_urls}')

    def parse(self, response):
        # Follow links to property detail pages
        for href in response.css('div[data-tk=unit-result]>a::attr(href)').getall():
            yield response.follow(href, callback=self.parse_detail)

        # Follow pagination links
        next_page = response.css('a[aria-label=Next]::attr(href)').get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)

    def parse_detail(self, response):
        item = FazwazPropertyrentItem()
        item['url'] = response.url
        item['listing_id'] = self._extract_from_css(
            response, 'strong[class*=unit-id]::text')
        item['title'] = self._extract_from_css(
            response, 'h1[class*=unit-name]::text')
        item['price'] = self._extract_from_css(
            response, 'div[class*=rent-price__price]::text')

        item['location'] = self._extract_location(response)

        item['bedrooms'] = self._extract_room_number(response, 'Bedroom')
        item['bathrooms'] = self._extract_room_number(response, 'Bathroom')

        item['property_type'] = self._extract_basic_info(
            response, 'Property Type')
        item['furnished'] = (self._extract_basic_info_alt(
            response, 'Furniture') or self._extract_basic_info(response, 'Furniture'))
        item['seller_name'] = (self._extract_basic_info_alt(
            response, 'Listed By') or self._extract_basic_info(response, 'Listed By'))
        item['area'] = (self._extract_basic_info(response, 'Size')
                        or self._extract_basic_info(response, 'Plot Size'))

        item['description'] = self._extract_description(response)
        item['images'] = self._extract_images(response)
        item['fetched_at'] = self.crawl_started_at

        yield item

    def _clean_ws(self, text: str) -> str:
        # Collapse internal whitespace per line and remove empty lines
        lines = [re.sub(r'\s+', ' ', ln).strip() for ln in text.splitlines()]
        lines = [ln for ln in lines if ln]
        return '\n'.join(lines)

    def _clean_comma_ws(self, text: str) -> str:
        # Remove whitespace around commas
        return re.sub(r'\s*,\s*', ', ', text).strip(' ,')

    def _extract_from_css(self, response, selector) -> str:
        data = response.css(selector).get() or ''
        return self._clean_ws(data) or ''

    def _extract_location(self, response) -> str:
        # Full location text may be in multiple parts
        data = response.xpath(
            'normalize-space(//span[contains(@class,"project-location")])').get()
        if not data:
            parts = response.css('span.project-location ::text').getall()
            data = ' '.join(p.strip() for p in parts if p and p.strip())
        location = self._clean_ws(data)
        location = self._clean_comma_ws(location)
        return location or ''

    def _extract_basic_info(self, response, attribute_key) -> str:
        # e.g., attribute_key = 'Property Type', 'Furniture', 'Listed By', 'Plot Size'
        data = response.xpath(
            f'//span[normalize-space(text())="{attribute_key}"]/following-sibling::span//text()').getall()
        return self._clean_ws(' '.join(data)) or ''

    def _extract_basic_info_alt(self, response, attribute_key) -> str:
        # e.g., 'Furnished' field
        data = response.xpath(
            f'//div[text()[normalize-space() = "{attribute_key}"]]/following-sibling::span/text()').getall()
        return self._clean_ws(' '.join(data)) or ''

    def _extract_room_number(self, response, room_type) -> int | None:
        # e.g., room_type = 'Bedroom' or 'Bathroom'
        data = response.xpath(
            f'//div[.//small[contains(text(), "{room_type}")]]/text()[normalize-space()]').get() or ''
        data = self._clean_ws(data)
        if data:
            match = re.search(r'\d+', data)
            if match:
                return int(match.group(0))
        return 0

    def _extract_description(self, response) -> str:
        # Full description text may be in multiple paragraphs
        data = response.css('div.unit-view-description')
        desc = data.xpath('string(.)').get() or ''
        return self._clean_ws(desc) or ''

    def _extract_images(self, response) -> list[str]:
        data = response.xpath(
            '//div[@id="gallery-detail-page-version-4"]//img/@src').getall()
        return [response.urljoin(self._clean_ws(img)) for img in data if img]
