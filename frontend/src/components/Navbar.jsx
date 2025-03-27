import React, { useState } from "react";
import { Link, NavLink } from "react-router";
import { Menu, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../redux/authSlice"; // Adjust the path accordingly

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dispatch = useDispatch();

  // Get authentication state from Redux
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [{ label: "Home", to: "/" }];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-gray-800">
              TaskMaster
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4 items-center">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `text-gray-700 hover:text-blue-600 transition-colors duration-300 ${
                    isActive ? "text-blue-600 font-semibold" : ""
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Login / Logout Button */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  Login
                </NavLink>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md ${
                      isActive ? "bg-gray-200 font-semibold" : ""
                    }`
                  }
                  onClick={toggleMenu}
                >
                  {link.label}
                </NavLink>
              ))}

              {/* Mobile Login/Logout Button */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        toggleMenu();
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors w-full"
                    >
                      Logout
                    </button>
                  ) : (
                    <NavLink
                      to="/login"
                      onClick={toggleMenu}
                      className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors w-full text-center block"
                    >
                      Login
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
