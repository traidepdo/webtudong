from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .models import Product, Category

class ProductSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return Product.objects.all().order_by('-created_at')

    def lastmod(self, obj):
        return obj.updated_at

class CategorySitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.7

    def items(self):
        return Category.objects.all()

class StaticViewSitemap(Sitemap):
    priority = 0.5
    changefreq = 'daily'

    def items(self):
        return ['home', 'products', 'blog', 'event']

    def location(self, item):
        # Since these are frontend routes, we return the path directly
        paths = {
            'home': '/',
            'products': '/products',
            'blog': '/blog',
            'event': '/event',
        }
        return paths.get(item)
