export function SafetyTips() {
  return (
    <div style={{
      background: '#fff7ed',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #fed7aa'
    }}>
      <h4 style={{
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#9a3412'
      }}>
        Safety Tips
      </h4>
      <ul style={{
        fontSize: '0.875rem',
        color: '#78350f',
        lineHeight: '1.7',
        paddingLeft: '1.25rem'
      }}>
        <li>Meet in a safe public place</li>
        <li>Check the item before payment</li>
        <li>Never pay in advance</li>
        <li>Beware of unrealistic offers</li>
      </ul>
    </div>
  );
}
