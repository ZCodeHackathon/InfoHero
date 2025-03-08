import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    username = profile?.username;
  }

  if (!hasEnvVars) {
    return (
      <div className="flex gap-4 items-center">
        <Badge variant="default" className="font-normal pointer-events-none">
          Please update .env.local file with anon key and url
        </Badge>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" disabled>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" variant="default" disabled>
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-4">
  {/* Displaying the username */}
  <Link href={`/profile/${user.id}`} passHref>
    <span className="text-black cursor-pointer font-bold hover:underline">
      Cześć, {username || "User"}!
    </span>
  </Link>

  {/* Form for Sign Out */}
  <form action={signOutAction}>
    <Button type="submit" variant="outline">
      Sign out
    </Button>
  </form>
</div>

  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
