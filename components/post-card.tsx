import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ThumbsUp } from "lucide-react";

export function CardWithForm() {
  return (
    <Card className="w-[350px] flex flex-col">
      <CardHeader className="flex flex-row items-center space-x-4">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <CardTitle>Sławek Mentzen</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>Mieszkania będą spadać!</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <ThumbsUp />
        </Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  );
}
