export function Select({ children, ...props }) {
    return (
      <select {...props}>
        {children}
      </select>
    );
  }
  
  export function SelectTrigger({ children }) {
    return <div>{children}</div>;
  }
  
  export function SelectValue({ children }) {
    return <div>{children}</div>;
  }
  