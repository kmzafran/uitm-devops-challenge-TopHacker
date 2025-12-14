# FazWaz Property Rent Scraper

Scrapy project that crawls FazWaz rental listings and exports them to a CSV. Configured for polite crawling, on-disk HTTP caching, and a simple data-cleaning pipeline.

- Project settings: [fazwaz_propertyrent/settings.py](fazwaz_propertyrent/settings.py)
- Spider: [fazwaz_propertyrent/spiders/fazwazrent.py](fazwaz_propertyrent/spiders/fazwazrent.py)
- Items: [fazwaz_propertyrent/items.py](fazwaz_propertyrent/items.py)
- Pipeline: [fazwaz_propertyrent/pipelines.py](fazwaz_propertyrent/pipelines.py)
- Scrapy config: [scrapy.cfg](scrapy.cfg)
- Packaging: [pyproject.toml](pyproject.toml), [poetry.lock](poetry.lock)

## Quick start

Prerequisites:
- Python and Poetry installed

Setup:
- Install deps: `poetry install`
- Run a shell: `poetry shell` (or prefix commands with `poetry run`)

Run:
- Crawl: `scrapy crawl fazwazrent`
- Output: `rentals.csv` at project root, as configured in [`fazwaz_propertyrent.settings.FEEDS`](fazwaz_propertyrent/settings.py)

### Sample command (Windows PowerShell)
```powershell
# from the project root
poetry install
poetry run scrapy crawl fazwazrent -a region=penang -a property_type=house
```

### Runtime arguments
- region: Region/location slug to crawl (e.g., penang, kuala-lumpur, sabah). See [`fazwaz_propertyrent/params.py`](fazwaz_propertyrent/params.py) for the source of truth.

Only available for Malaysian Region:
- johor
- kedah
- kelantan
- melaka
- negeri-sembilan
- pahang
- perak
- perlis
- penang
- sabah
- sarawak
- selangor
- terengganu
- kuala-lumpur
- putrajaya
- labuan

- property_type: Filter by property type.

Allowed property_type values in this project:
- property
- condo
- apartment
- house
- townhouse
- villa
- penthouse

To verify or update the allowed lists, check [`fazwaz_propertyrent/params.py`](fazwaz_propertyrent/params.py)

## Data schema

Exported CSV columns (see [`fazwaz_propertyrent.settings.FEEDS`](fazwaz_propertyrent/settings.py)):
- listing_id, title, url, price
- location, property_type
- bedrooms, bathrooms, area, furnished
- description, images, seller_name
- fetched_at

Item definition: [`fazwaz_propertyrent.items.FazwazPropertyrentItem`](fazwaz_propertyrent/items.py)

## How it works

- Spider
  - Implementation: [fazwaz_propertyrent/spiders/fazwazrent.py](fazwaz_propertyrent/spiders/fazwazrent.py)
  - Respects robots.txt: [`fazwaz_propertyrent.settings.ROBOTSTXT_OBEY`](fazwaz_propertyrent/settings.py) = True
- Item Pipeline
  - [`fazwaz_propertyrent.pipelines.FazwazPropertyrentPipeline`](fazwaz_propertyrent/pipelines.py)
  - Joins image URLs into a single pipe-separated string
  - Ensures bedrooms, bathrooms, area are non-null (empty string if missing)
- Settings highlights
  - Concurrency throttle: [`fazwaz_propertyrent.settings.CONCURRENT_REQUESTS_PER_DOMAIN`](fazwaz_propertyrent/settings.py) = 1
  - Delay between requests: [`fazwaz_propertyrent.settings.DOWNLOAD_DELAY`](fazwaz_propertyrent/settings.py) = 1s
  - HTTP cache: [`fazwaz_propertyrent.settings.HTTPCACHE_ENABLED`](fazwaz_propertyrent/settings.py) = True (stored under `.scrapy/httpcache/...`)
  - Feed export encoding: UTF-8; won't overwrite existing file (`overwrite: False`)

## Project layout

- Scrapy project: [fazwaz_propertyrent/](fazwaz_propertyrent)
  - Spider(s): [fazwaz_propertyrent/spiders/](fazwaz_propertyrent/spiders)
  - Parameters: [fazwaz_propertyrent/params.py](fazwaz_propertyrent/params.py)
  - Items: [fazwaz_propertyrent/items.py](fazwaz_propertyrent/items.py)
  - Pipeline: [fazwaz_propertyrent/pipelines.py](fazwaz_propertyrent/pipelines.py)
  - Settings: [fazwaz_propertyrent/settings.py](fazwaz_propertyrent/settings.py)

## Tips

- Clear HTTP cache to re-fetch: delete `.scrapy/httpcache/`
- Change output filename/fields in [`fazwaz_propertyrent.settings.FEEDS`](fazwaz_propertyrent/settings.py)
- Adjust crawl politeness: tweak [`DOWNLOAD_DELAY`](fazwaz_propertyrent/settings.py) and [`CONCURRENT_REQUESTS_PER_DOMAIN`](fazwaz_propertyrent/settings.py)