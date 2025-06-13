const Article: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <main className={`mb-auto ${className || ""}`}>{children}</main>;
};
export default Article;
