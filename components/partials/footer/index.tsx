import React from "react";
import FooterContent from "./footer-content";
import MobileBottomNav from "./mobile-bottom-nav";

const DashCodeFooter = async () => {
  return (
    <FooterContent>
      <div className=" md:flex  justify-between text-default-600 hidden">
        <div className="text-center md:ltr:text-start md:rtl:text-right text-sm">
          COPYRIGHT &copy; {new Date().getFullYear()} SAMS, All rights
          Reserved
        </div>
        {/* <div className="md:ltr:text-right md:rtl:text-end text-center text-sm">
          Hand-crafted & Made by{" "}
          <a
            href="https://codeshaper.net"
            target="_blank"
            className="text-primary font-semibold"
          >
            Codeshaper
          </a>
        </div> */}
      </div>
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </FooterContent>
  );
};

export default DashCodeFooter;
