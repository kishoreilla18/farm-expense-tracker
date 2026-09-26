"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";

export default function SweetAlertHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      Swal.fire({
        title: "Success! 🌱",
        text: success,
        icon: "success",
        timer: 3500,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
        background: "#1F3D2B",
        color: "#FBF9F4",
        customClass: {
          popup: "rounded-xl shadow-xl border border-sprout/40"
        }
      });

      // Remove query param cleanly after toast without page reload
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("success");
      const newQuery = newParams.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
    } else if (error) {
      Swal.fire({
        title: "Attention ⚠️",
        text: error,
        icon: "warning",
        confirmButtonText: "Understand",
        confirmButtonColor: "#C94A29",
        background: "#FBF9F4",
        color: "#1A1A1A",
        customClass: {
          popup: "rounded-2xl shadow-2xl border border-clay/30"
        }
      });

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("error");
      const newQuery = newParams.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
    }
  }, [searchParams, router, pathname]);

  return null;
}
