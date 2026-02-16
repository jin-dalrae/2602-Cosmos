// Button to jump to a random article
export default function RandomArticleButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                position: 'absolute',
                bottom: 24,
                left: 24,
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 12,
                border: '1px solid #D4B872',
                backgroundColor: 'rgba(212, 184, 114, 0.12)',
                backdropFilter: 'blur(8px)',
                color: '#D4B872',
                fontSize: 14,
                fontFamily: 'Georgia, serif',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(212, 184, 114, 0.2)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(212, 184, 114, 0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'
            }}
        >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Random Article
        </button>
    )
}
