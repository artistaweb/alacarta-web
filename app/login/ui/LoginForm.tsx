import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
   sent?: boolean; error?: string | null
};

export default function LoginForm({ sent, error }: LoginFormProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Acceso Admin</CardTitle>
        <CardDescription>
          Ingresa tu correo para recibir un enlace de acceso.
        </CardDescription>
        {sent ? (
          <CardDescription className="text-emerald-500">
            Enlace enviado. Revisa tu correo.
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <form action="/auth/otp" method="post" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="w-full">
            Enviar enlace
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
