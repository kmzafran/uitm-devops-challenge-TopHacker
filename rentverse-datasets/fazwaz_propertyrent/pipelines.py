# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter


class FazwazPropertyrentPipeline:
    def process_item(self, item, spider):
        a = ItemAdapter(item)
        imgs = a.get('images')
        if isinstance(imgs, (list, tuple)):
            a['images'] = " | ".join(str(u) for u in imgs if u)
        for f in ["bedrooms", "bathrooms", "area"]:
            if a.get(f) is None:
                a[f] = ''
        return item
