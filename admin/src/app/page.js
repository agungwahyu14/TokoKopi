import { redirect } from "next/navigation";

export default function Home() {
  // Langsung arahkan ke dashboard. 
  // Jika belum login, middleware akan menangkap dan mengarahkan ke /login.
  redirect("/dashboard");
  
  return null;
}
