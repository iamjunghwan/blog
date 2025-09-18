"use client";

import Link from "next/link";
import { useState } from "react";
import MenuToggle from "../../public/MenuToggle.svg";

const MenuToggleButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="p-4">
        <button
          type="button"
          className="rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-center items-center"
          aria-label="메뉴 열기"
          onClick={handleClick}
        >
          <MenuToggle className="w-6 h-6" />
        </button>
      </div>

      {isOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/50 dark:bg-white/50">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleClick}
          />
          <div className="absolute top-0 right-0 w-64 h-full bg-gray-900 dark:bg-white  shadow-lg">
            <div className="flex justify-end p-4">
              <button
                onClick={handleClick}
                className="p-2 rounded-md text-white dark:text-black hover:bg-gray-200 dark:hover:bg-gray-200"
                aria-label="메뉴 닫기"
              >
                <svg
                  className="w-6 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="px-4 py-6">
              <div className="space-y-4">
                <Link
                  href="/post/all/1"
                  className="block p-3 text-lg  text-white hover:bg-gray-300 dark:text-black  rounded-md"
                  onClick={closeMobileMenu}
                >
                  Posts
                </Link>
                <Link
                  href="/about"
                  className="block p-3 text-lg text-white hover:bg-gray-300 dark:text-black  rounded-md"
                  onClick={closeMobileMenu}
                >
                  About
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
export default MenuToggleButton;
