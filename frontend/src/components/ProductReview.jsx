import React, { useEffect, useState } from 'react';
import api from '../api';
import '../review.css';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const StarRating = ({ value, onChange, readonly = false, size = 'md' }) => {
    const [hovered, setHovered] = useState(0);
    const active = hovered || value;

    return (
        <div className={`star-rating star-rating--${size} ${readonly ? 'star-rating--readonly' : ''}`}>
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= active ? 'star-btn--filled' : ''}`}
                    onClick={() => !readonly && onChange && onChange(star)}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    disabled={readonly}
                    aria-label={`${star} sao`}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

const RatingBar = ({ rating, count, total }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="rating-bar">
            <span className="rating-bar__label">{rating}★</span>
            <div className="rating-bar__track">
                <div className="rating-bar__fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="rating-bar__count">{count}</span>
        </div>
    );
};

const ReviewCard = ({ review }) => {
    const initials = review.username?.slice(0, 2).toUpperCase() || '??';
    const date = new Date(review.created_at).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    return (
        <div className="review-card">
            <div className="review-card__header">
                <div className="review-card__avatar">
                    {review.avatar
                        ? <img src={review.avatar} alt={review.username} />
                        : <span>{initials}</span>
                    }
                </div>
                <div className="review-card__meta">
                    <p className="review-card__name">{review.username}</p>
                    <StarRating value={review.rating} readonly size="sm" />
                </div>
                <span className="review-card__date">{date}</span>
            </div>
            {review.comment && (
                <p className="review-card__comment">{review.comment}</p>
            )}
        </div>
    );
};

const ProductReview = ({ slug, productName }) => {
    const [reviews, setReviews] = useState([]);
    const [eligibility, setEligibility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { user } = useAuth();
    const fetchReviews = async () => {
        try {
            const res = await api.get(`/products/${slug}/reviews/`);
            setReviews(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEligibility = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return; // Don't fetch if not logged in
        try {
            const res = await api.get(`/products/${slug}/review-eligibility/`);
            setEligibility(res.data);
        } catch (err) {
            // Not logged in or error — ignore silently
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchReviews(), fetchEligibility()]);
            setLoading(false);
        };
        init();
    }, [slug]);

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;
    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length
    }));

    const handleSubmit = async () => {
        if (!rating) { setError('Vui lòng chọn số sao.'); return; }
        setError('');
        setSubmitting(true);
        try {
            await api.post(`/products/${slug}/reviews/`, { rating, comment });
            setSuccess('Cảm ơn bạn đã đánh giá!');
            setShowForm(false);
            setRating(0);
            setComment('');
            await fetchReviews();
            await fetchEligibility();
        } catch (err) {
            const msg = err.response?.data?.non_field_errors?.[0]
                || err.response?.data?.detail
                || 'Có lỗi xảy ra, vui lòng thử lại.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <section className="review-section">
            <div className="review-section__inner">
                <h2 className="review-section__title">Đánh giá sản phẩm</h2>

                {/* Summary */}
                {totalReviews > 0 && (
                    <div className="review-summary">
                        <div className="review-summary__score">
                            <span className="review-summary__avg">{avgRating}</span>
                            <StarRating value={Math.round(avgRating)} readonly size="lg" />
                            <span className="review-summary__total">{totalReviews} đánh giá</span>
                        </div>
                        <div className="review-summary__bars">
                            {ratingCounts.map(({ star, count }) => (
                                <RatingBar key={star} rating={star} count={count} total={totalReviews} />
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA / Status */}
                <div className="review-cta">
                    {!user && !eligibility && (
                        <p className="review-cta__note">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            ...Đăng nhập để xem... <Link to='/login' style={{ color: "#000000ff", textDecoration: "none", fontWeight: "bold" }}>Đăng nhập</Link>
                        </p>
                    )}
                    {eligibility && !eligibility.can_review && !eligibility.existing_review && (
                        <p className="review-cta__note review-cta__note--warn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            {eligibility.message}
                        </p>
                    )}
                    {eligibility?.existing_review && (
                        <div className="review-cta__done">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                            Bạn đã đánh giá sản phẩm này
                            <StarRating value={eligibility.existing_review.rating} readonly size="sm" />
                        </div>
                    )}
                    {eligibility?.can_review && !showForm && (
                        <button className="review-cta__btn" onClick={() => { setShowForm(true); setSuccess(''); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            Viết đánh giá của bạn
                        </button>
                    )}
                    {success && (
                        <p className="review-cta__success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                            {success}
                        </p>
                    )}
                </div>

                {/* Form */}
                {showForm && eligibility?.can_review && (
                    <div className="review-form">
                        <div className="review-form__inner">
                            <h3 className="review-form__heading">Chia sẻ trải nghiệm của bạn</h3>
                            <p className="review-form__subheading">{productName}</p>

                            <div className="review-form__field">
                                <label>Xếp hạng của bạn</label>
                                <StarRating value={rating} onChange={setRating} size="xl" />
                                <span className="review-form__rating-label">
                                    {['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Xuất sắc'][rating] || ''}
                                </span>
                            </div>

                            <div className="review-form__field">
                                <label htmlFor="review-comment">Nhận xét (tùy chọn)</label>
                                <textarea
                                    id="review-comment"
                                    className="review-form__textarea"
                                    rows={4}
                                    placeholder="Chia sẻ cảm nhận về chất lượng, kích thước, màu sắc..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    maxLength={1000}
                                />
                                <span className="review-form__char-count">{comment.length}/1000</span>
                            </div>

                            {error && <p className="review-form__error">{error}</p>}

                            <div className="review-form__actions">
                                <button
                                    className="review-form__cancel"
                                    onClick={() => { setShowForm(false); setError(''); }}
                                    disabled={submitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    className="review-form__submit"
                                    onClick={handleSubmit}
                                    disabled={submitting || !rating}
                                >
                                    {submitting ? (
                                        <span className="review-form__spinner" />
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                            Gửi đánh giá
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="review-list">
                    {loading && (
                        <div className="review-list__loading">
                            {[1, 2, 3].map(i => <div key={i} className="review-skeleton" />)}
                        </div>
                    )}
                    {!loading && reviews.length === 0 && (
                        <div className="review-list__empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                            </svg>
                            <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                        </div>
                    )}
                    {!loading && reviews.map(review => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductReview;