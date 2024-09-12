// import DarkModeToggle from "./components/DarkModeToggle";
import Search from "./components/Search";

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-black dark:text-black">
      <header className="p-4 flex justify-end">
        {/* <DarkModeToggle /> */}
      </header>
      <main className="p-4">
        <h1 className="text-2xl text-center font-bold">Melodus</h1>
        <Search />
      </main>
    </div>
  );
}

export default App;
