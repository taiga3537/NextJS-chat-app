import React, { useEffect, useState, useRef } from 'react';
import { useMessages } from '@ably/chat/react';
import styles from './ChatBox.module.css';

export default function ChatBox() {
  const inputBox = useRef(null);
  const messageEndRef = useRef(null);

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const messageTextIsEmpty = messageText.trim().length === 0;

  const { send: sendMessage } = useMessages({
    listener: (payload) => {
      const newMessage = payload.message;
      setMessages((prevMessages) => {
        if (prevMessages.some((existingMessage) => existingMessage.isSameAs(newMessage))) {
          return prevMessages;
        }

        const index = prevMessages.findIndex((existingMessage) => existingMessage.after(newMessage));

        const newMessages = [...prevMessages];
        if (index === -1) {
          newMessages.push(newMessage);
        } else {
          newMessages.splice(index, 0, newMessage);
        }
        return newMessages;
      });
    },
  });

  const sendChatMessage = async (text) => {
    if (!sendMessage) {
      return;
    }
    try {
      await sendMessage({ text: text });
      setMessageText('');
      inputBox.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFormSubmission = (event) => {
    event.preventDefault();
    sendChatMessage(messageText);
  };

  const handleKeyPress = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }
    event.preventDefault();
    sendChatMessage(messageText);
  };

  // --- メッセージ表示リストの生成（改造部分） ---
  const messageElements = messages.map((message, index) => {
    const key = message.serial ?? index;
    
    // 発言者の名前を取得
    const authorName = message.clientId || "匿名"; 
    
    // 名前の判定：'Admin' という名前の時だけ特別なスタイルを適用する
    const isAdmin = authorName === 'taiga3537'; 

    return (
      <div key={key} style={{ 
        marginBottom: '14px', 
        paddingLeft: '10px',
        // 管理者なら左側に赤い縦線を表示して強調する
        borderLeft: isAdmin ? '4px solid #ff4b4b' : 'none' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          {/* 名前の表示：管理者は赤色、それ以外はグレー */}
          <span style={{ 
            fontWeight: 'bold', 
            fontSize: '0.85em', 
            color: isAdmin ? '#ff4b4b' : '#555' 
          }}>
            {authorName}
          </span>

          {/* 管理者専用の「OFFICIAL」バッジ（テキストと枠線のみ） */}
          {isAdmin && (
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '10px', 
              padding: '1px 5px', 
              border: '1px solid #ff4b4b', 
              color: '#ff4b4b', 
              borderRadius: '4px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              backgroundColor: '#fffafa' // 背景に極めて薄い赤を入れる
            }}>
              OFFICIAL
            </span>
          )}
        </div>
        
        {/* メッセージ本文 */}
        <span className={styles.message}>
          {message.text}
        </span>
      </div>
    );
  });
  // ------------------------------------------

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.chatHolder}>
      <div className={styles.chatText}>
        {messageElements}
        <div ref={messageEndRef}></div>
      </div>
      <form onSubmit={handleFormSubmission} className={styles.form}>
        <textarea
          ref={inputBox}
          value={messageText}
          placeholder={'Type a message...'}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.textarea}
        ></textarea>
        <button type="submit" className={styles.button} disabled={messageTextIsEmpty}>
          Send
        </button>
      </form>
    </div>
  );
}
