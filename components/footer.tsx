import Link from "next/link"
import { Youtube, Facebook, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full bg-primary-blue text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">About us</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="#">Corporate Info</Link></li>
              <li><Link href="#">Global Partnership</Link></li>
              <li><Link href="#">Our People</Link></li>
              <li><Link href="#">Regional Network</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Business Solutions</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="#">Aviation Services</Link></li>
              <li><Link href="#">Freight Management</Link></li>
              <li><Link href="#">Contract Logistics</Link></li>
              <li><Link href="#">Railway Logistics</Link></li>
              <li><Link href="#">Last Mile and Express</Link></li>
              <li><Link href="#">E-commerce Logistics</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Career</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="#">Working Environment</Link></li>
              <li><Link href="#">Why Join ITL</Link></li>
              <li><Link href="#">Opportunities</Link></li>
              <li><Link href="#">Job Opening</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Customer Center</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="#">Booking & Inquiry</Link></li>
              <li><Link href="#">Track & Trace</Link></li>
              <li><Link href="#">Question & Answer</Link></li>
              <li><Link href="#">Customer Experience</Link></li>
              <li><Link href="#">Contact</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">News & Media</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="#">Corporate News</Link></li>
              <li><Link href="#">Brochure Download</Link></li>
              <li><Link href="#">Industry News</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Connect with us</h3>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-gray-200">
                <Youtube className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-gray-200">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-gray-200">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="container mx-auto flex flex-col items-center justify-between px-4 py-4 sm:flex-row">
          <div className="text-gray-600 flex gap-4 items-center">
            {/* Note: Replace this comment with your logo component */}        
            <img src="./images/logo.png" alt="ITL logo" className='h-12 w-auto'/>
            <p className="">©2024 Indo Trans Logistics Corporation. All right reserved.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm sm:mt-0 text-gray-600">
            <Link href="#" className=" hover:text-black">Privacy Policy</Link>
            <Link href="#" className=" hover:text-black">Terms of Use</Link>
            <Link href="#" className=" hover:text-black">Sitemap</Link>
          </div>
        </div>
      </div>
      </div>
      
    </footer>
  )
}