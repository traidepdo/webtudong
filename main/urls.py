from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CategoryViewSet, ProductViewSet, ProductVariantViewSet,
    OrderViewSet, RegisterView, UserProfileView, home,
    UserViewSet, AdminStatsView, ColorViewSet, SizeViewSet, ProductImageViewSet, related_products,product_chat, submit_checkout, chat_history, ReviewListCreateView, ReviewEligibilityView,
    AllReviewsViewSet,BrandViewSet,
    BlogCategoryListView, BlogPostListView, BlogPostDetailView,
    BlogCommentListCreateView, BlogCommentDeleteView,
    NotificationListView, notification_unread_count, notification_mark_read, notification_mark_all_read
)
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'variants', ProductVariantViewSet, basename='variant')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'users', UserViewSet, basename='user')
router.register(r'colors', ColorViewSet, basename='color')
router.register(r'sizes', SizeViewSet, basename='size')
router.register(r'product-images', ProductImageViewSet, basename='product-image')
router.register(r'reviews', AllReviewsViewSet, basename='review')
router.register(r'brands', BrandViewSet, basename='brand')
 

urlpatterns = [
    path('', home, name='home'),
    path('api/', include(router.urls)),
    # Auth URLs
    path('api/register/', RegisterView.as_view(), name='auth_register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('api/products/<slug:slug>/related/', related_products, name='related_products'),
    path('api/products/<slug:slug>/reviews/', ReviewListCreateView.as_view(), name='product-reviews'),
    path('api/products/<slug:slug>/review-eligibility/', ReviewEligibilityView.as_view(), name='review-eligibility'),
    path('api/chat/', product_chat, name='product_chat'),
    path('api/chat/history/', chat_history, name='chat_history'),
    path('api/submit-checkout/', submit_checkout, name='submit_checkout'),
    
    # Blog URLs
    path('api/blog/categories/', BlogCategoryListView.as_view(), name='blog-categories'),
    path('api/blog/posts/', BlogPostListView.as_view(), name='blog-posts'),
    path('api/blog/posts/<slug:slug>/', BlogPostDetailView.as_view(), name='blog-post-detail'),
    path('api/blog/posts/<slug:slug>/comments/', BlogCommentListCreateView.as_view(), name='blog-post-comments'),
    path('api/blog/comments/<int:pk>/', BlogCommentDeleteView.as_view(), name='blog-comment-delete'),

    # Notification URLs
    path('api/notifications/', NotificationListView.as_view(), name='notification-list'),
    path('api/notifications/unread-count/', notification_unread_count, name='notification-unread-count'),
    path('api/notifications/<int:pk>/read/', notification_mark_read, name='notification-mark-read'),
    path('api/notifications/mark-all-read/', notification_mark_all_read, name='notification-mark-all-read'),
]