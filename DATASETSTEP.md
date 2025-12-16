# Datasets Scraper Setup Guide (Beginner Friendly)

This guide will help you set up and run the **Rentverse Datasets Scraper** step by step.

---

## What is This Service?

This is a **web scraper** built with Scrapy that collects rental property data from FazWaz Malaysia. It exports the data to a CSV file that can be used for:
- Training ML models
- Data analysis
- Populating the database

---

## Prerequisites

Before starting, make sure you have these installed:

| Requirement | Download Link |
|-------------|---------------|
| **Python 3.12+** | [https://python.org/downloads](https://python.org/downloads) |
| **Poetry** | [https://python-poetry.org](https://python-poetry.org/docs/#installation) |

> **Tip:** To check if you have them installed:
> ```bash
> python --version    # Should be 3.12+
> poetry --version    # Check Poetry version
> ```

### Installing Poetry

If you don't have Poetry installed:

```bash
# Windows (PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

# Mac / Linux
curl -sSL https://install.python-poetry.org | python3 -
```

---

## Step 1: Navigate to the Datasets Directory

Open your terminal and navigate to the datasets folder:

```bash
cd rentverse-datasets
```

---

## Step 2: Install Dependencies

```bash
poetry install
```

This installs Scrapy and all required packages.

---

## Step 3: Run the Scraper

### Basic Usage

```bash
poetry run scrapy crawl fazwazrent
```

This will scrape all rental properties and save them to `rentals.csv`.

### With Specific Region

```bash
poetry run scrapy crawl fazwazrent -a region=penang
```

### With Region AND Property Type

```bash
poetry run scrapy crawl fazwazrent -a region=kuala-lumpur -a property_type=condo
```

---

## Available Regions (Malaysia Only)

| Region | Command Value |
|--------|---------------|
| Johor | `johor` |
| Kedah | `kedah` |
| Kelantan | `kelantan` |
| Melaka | `melaka` |
| Negeri Sembilan | `negeri-sembilan` |
| Pahang | `pahang` |
| Perak | `perak` |
| Perlis | `perlis` |
| Penang | `penang` |
| Sabah | `sabah` |
| Sarawak | `sarawak` |
| Selangor | `selangor` |
| Terengganu | `terengganu` |
| Kuala Lumpur | `kuala-lumpur` |
| Putrajaya | `putrajaya` |
| Labuan | `labuan` |

---

scrape all properties in Malaysia:
```bash
poetry run scrapy crawl fazwazrent -a region=johor

```

```bash
poetry run scrapy crawl fazwazrent -a region=kuala-lumpur
```

## Available Property Types

| Type | Command Value |
|------|---------------|
| All Properties | `property` |
| Condominium | `condo` |
| Apartment | `apartment` |
| House | `house` |
| Townhouse | `townhouse` |
| Villa | `villa` |
| Penthouse | `penthouse` |

---

## Example Commands

```bash
# Scrape houses in Penang
poetry run scrapy crawl fazwazrent -a region=penang -a property_type=house

# Scrape condos in Kuala Lumpur
poetry run scrapy crawl fazwazrent -a region=kuala-lumpur -a property_type=condo

# Scrape all properties in Selangor
poetry run scrapy crawl fazwazrent -a region=selangor

# Scrape villas in Sabah
poetry run scrapy crawl fazwazrent -a region=sabah -a property_type=villa
```

---

## Output Data

The scraper exports data to `rentals.csv` with these columns:

| Column | Description |
|--------|-------------|
| `listing_id` | Unique property ID |
| `title` | Property title |
| `url` | Link to listing |
| `price` | Rental price |
| `location` | Property location |
| `property_type` | Type of property |
| `bedrooms` | Number of bedrooms |
| `bathrooms` | Number of bathrooms |
| `area` | Property size |
| `furnished` | Furnishing status |
| `description` | Property description |
| `images` | Image URLs (pipe-separated) |
| `seller_name` | Agent/seller name |
| `fetched_at` | Scrape timestamp |

---

## Project Structure

```
rentverse-datasets/
├── fazwaz_propertyrent/      # Scrapy project
│   ├── spiders/              # Spider definitions
│   │   └── fazwazrent.py     # Main scraper spider
│   ├── items.py              # Data item structure
│   ├── middlewares.py        # Request/response handlers
│   ├── params.py             # Allowed regions & types
│   ├── pipelines.py          # Data processing pipeline
│   └── settings.py           # Scrapy settings
├── pyproject.toml            # Poetry dependencies
├── scrapy.cfg                # Scrapy configuration
└── README.md                 # Documentation
```

---

## Tech Stack

- **Scrapy** - Web scraping framework
- **Python 3.12+** - Programming language
- **Poetry** - Dependency management

---

## Scraper Settings

The scraper is configured to be polite and avoid overloading the website:

| Setting | Value | Description |
|---------|-------|-------------|
| `ROBOTSTXT_OBEY` | True | Respects robots.txt rules |
| `DOWNLOAD_DELAY` | 1 second | Delay between requests |
| `CONCURRENT_REQUESTS_PER_DOMAIN` | 1 | One request at a time |
| `HTTPCACHE_ENABLED` | True | Caches responses locally |

---

## Troubleshooting

### "Scrapy not found"
```bash
poetry install
```

### "No data in CSV"
- Check if the region/property_type is valid
- The website might be blocking requests
- Try clearing the cache: delete `.scrapy/httpcache/` folder

### "Permission denied" or "File locked"
- Close the `rentals.csv` file if it's open in Excel
- Delete the file and run again

### "Python not found"
- Make sure Python 3.12+ is installed
- Try `python3` instead of `python`

### Want to re-scrape the same pages?
Delete the HTTP cache:
```bash
# Windows
rmdir /s /q .scrapy

# Mac / Linux
rm -rf .scrapy
```

---

## Tips

### Change Output Filename
Edit `fazwaz_propertyrent/settings.py` and modify the `FEEDS` setting.

### Speed Up Scraping (Not Recommended)
Edit `fazwaz_propertyrent/settings.py`:
```python
DOWNLOAD_DELAY = 0.5  # Reduce delay (be careful!)
CONCURRENT_REQUESTS_PER_DOMAIN = 2  # More concurrent requests
```
> **Warning:** Be respectful to websites. Aggressive scraping may get you blocked.

### Run in Poetry Shell
```bash
poetry shell
scrapy crawl fazwazrent -a region=penang
```

---

## Need Help?

- Check the main [README.md](./README.md) for more details
- View [params.py](./fazwaz_propertyrent/params.py) for allowed regions and types
- Check [settings.py](./fazwaz_propertyrent/settings.py) for scraper configuration

---

Happy scraping!
