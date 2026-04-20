import React from 'react'

/**
 * Welcome Component
 * @param {Object} props - Dữ liệu truyền từ component cha
 * @param {string} props.username - Tên người dùng
 */
function Welcome(props) {
  return (
    <div className="welcome-section">
      <h1>Chào mừng, <span className="highlight">{props.username}</span>!</h1>
      <p>Đây là Component đầu tiên của bạn.</p>
    </div>
  )
}

export default Welcome
