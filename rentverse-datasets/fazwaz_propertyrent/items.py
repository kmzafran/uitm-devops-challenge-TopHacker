# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class FazwazPropertyrentItem(scrapy.Item):
    listing_id = scrapy.Field()
    title = scrapy.Field()
    url = scrapy.Field()
    price = scrapy.Field()

    location = scrapy.Field()
    property_type = scrapy.Field()
    bedrooms = scrapy.Field()
    bathrooms = scrapy.Field()
    area = scrapy.Field()
    furnished = scrapy.Field()

    description = scrapy.Field()
    images = scrapy.Field()
    seller_name = scrapy.Field()
    fetched_at = scrapy.Field()
