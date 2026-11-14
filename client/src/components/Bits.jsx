export const Status = ({ value }) => <span className={`tag tag-${value}`}>{String(value).replace('_', ' ')}</span>;

export const Avatar = ({ visitor, size = 36 }) =>
  visitor?.photo ? (
    <img className="avatar" src={visitor.photo} alt="" style={{ width: size, height: size }} />
  ) : (
    <span className="avatar ph" style={{ width: size, height: size }}>
      {(visitor?.name || '?').charAt(0).toUpperCase()}
    </span>
  );

export const Empty = ({ children }) => <div className="empty">{children}</div>;
export const ErrorBox = ({ msg }) => (msg ? <div className="alert error">{msg}</div> : null);
