import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import { useToast } from "./MobileToast";

const AndroidBackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    const rootPaths = ["/", "/dashboard", "/my-trips", "/activities", "/profile"];

    const handleBackButton = async (data) => {
      // 1. Dispatch custom event to close overlays/modals
      const hardwareBackEvent = new CustomEvent("hardwareBack", {
        cancelable: true,
        bubbles: true,
      });
      window.dispatchEvent(hardwareBackEvent);

      // If an overlay/modal was open and handled the close action, we stop
      if (hardwareBackEvent.defaultPrevented) {
        return;
      }

      // 2. Check if we are at root paths
      const currentPath = location.pathname;
      const isRoot = rootPaths.includes(currentPath);

      if (isRoot) {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Double press exit
          App.exitApp();
        } else {
          lastBackPressRef.current = now;
          toast.info("Press back again to exit");
        }
      } else {
        // Go back in router history
        navigate(-1);
      }
    };

    const registerListener = async () => {
      return await App.addListener("backButton", handleBackButton);
    };

    const listenerPromise = registerListener();

    return () => {
      listenerPromise.then((listener) => {
        listener.remove();
      });
    };
  }, [location.pathname, navigate, toast]);

  return null;
};

export default AndroidBackButtonHandler;
