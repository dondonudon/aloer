// Static skeleton rendered while the real Sidebar suspends on user/store data.
// Must mirror the live Sidebar's outer dimensions so the layout shell paints
// without a layout shift once the real component swaps in:
//   - mobile: fixed h-14 top bar
//   - desktop: w-64 left rail
export function SidebarSkeleton() {
  return (
    <>
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm pointer-events-none">
        <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-7 w-7 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </header>

      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 dark:lg:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
        aria-hidden="true"
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 py-3 px-2 space-y-4">
          {(["g1", "g2", "g3"] as const).map((group) => (
            <div key={group} className="space-y-1.5">
              <div className="h-3 w-20 mx-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              {(["i1", "i2", "i3"] as const).map((item) => (
                <div key={item} className="flex items-center gap-3 px-3 py-2">
                  <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </aside>
    </>
  );
}
