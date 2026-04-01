'use client';

import { useEffect } from 'react';

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Student] Page error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080F1C',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        background: '#0D1829',
        border: '1px solid rgba(251,191,36,.25)',
        borderRadius: 20,
        padding: 32,
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(251,191,36,.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 24,
        }}>📚</div>

        <h2 style={{ color: '#E2EAF4', fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>
          Trang gặp sự cố
        </h2>
        <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, margin: '0 0 20px' }}>
          Đã xảy ra lỗi trong khi tải trang học sinh. Nội dung bài học vẫn an toàn.
        </p>

        {error.digest && (
          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 11, margin: '0 0 20px', fontFamily: 'monospace' }}>
            ID: {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px', borderRadius: 10,
              background: '#185FA5', color: 'white',
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            Thử lại
          </button>
          <button
            onClick={() => window.location.href = '/student'}
            style={{
              padding: '10px 20px', borderRadius: 10,
              background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)',
              border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >
            Về trang học
          </button>
        </div>
      </div>
    </div>
  );
}
