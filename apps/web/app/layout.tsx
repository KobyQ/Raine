import './globals.css';

export const metadata = { 
  title: 'RaineBank Data Vault', 
  description: 'Institutional Financial Intelligence' 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
