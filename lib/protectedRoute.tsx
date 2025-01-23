import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./utils/authStore";

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    useEffect(() => {
      if (!isAuthenticated) {
        router.push("/signin");
      }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
