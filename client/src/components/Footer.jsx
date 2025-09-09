import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="px-6 md:px-16 mt-40 lg:px-36 w-full text-gray-300">
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
        <div className="md:max-w-96">
          <img alt="logo" className="h-11" src={assets.logo} />
          <p className="mt-6 text-sm">
            Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <img src={assets.googlePlay} alt="google play" className="h-9 w-auto cursor-pointer" />
            <img src={assets.appStore} alt="app store" className="h-9 w-auto cursor-pointer" />
          </div>
        </div>
        <div className="flex-1 flex items-start md:justify-end gap-20 md:gap-40">
          <div>
            <h2 className="font-semibold mb-5">Company</h2>
            <ul className="flex flex-col  text-sm space-y-2">
              <Link className='hover:text-red-400 transition duration-500' to='/'>Home</Link>
              <Link className='hover:text-red-400 transition duration-500' to='/movies'>Movies</Link>
              <Link className='hover:text-red-400 transition duration-500' to='/'>Theaters</Link>
              <Link className='hover:text-red-400 transition duration-500' to='/'>Releases</Link>
              <Link className='hover:text-red-400 transition duration-500' to='/favorite'>Favorites</Link>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold mb-5">Get in touch</h2>
            <div className="text-sm space-y-2">
              <p>+1-234-567-890</p>
              <p>contact@example.com</p>
            </div>
          </div>
        </div>
      </div>
      <p className="pt-4 text-center text-sm pb-5">
        Copyright {new Date().getFullYear()} © QuickShow. All Right Reserved.
      </p>
    </footer>
  )
}

export default Footer
