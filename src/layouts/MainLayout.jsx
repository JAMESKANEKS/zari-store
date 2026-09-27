import Sidebar from "../components/layout/Sidebar";

function MainLayout({ children, role }) {
  return (
    <div className="app-layout">

      <Sidebar role={role} />

      <main className="main-content">
        {children}
      </main>

    </div>
  );
}

export default MainLayout;