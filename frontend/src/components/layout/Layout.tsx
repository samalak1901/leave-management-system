import React, { ReactNode } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;