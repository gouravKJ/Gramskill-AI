import type { Metadata } from "next";
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineDemoNote } from "@/components/shared/brand";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-page py-14">
      <Badge variant="muted" className="mb-4">
        Contact
      </Badge>
      <h1 className="font-display text-3xl font-bold tracking-tight">Talk to the team</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Questions about the matching model, the agent architecture or deploying this for a district
        programme? These are placeholder contact channels for the academic prototype.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Mail, title: "Email", detail: "hello@gramskill.demo" },
          { icon: Phone, title: "Helpline", detail: "1800-000-000 (9am–6pm)" },
          { icon: MessageSquare, title: "WhatsApp", detail: "+91 00000 00000" },
          { icon: MapPin, title: "Office", detail: "District Skills Mission (Demo), Odisha" },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </span>
              <CardTitle className="pt-2 text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.detail}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <InlineDemoNote>
          Contact details are fictional placeholders. For a real deployment, replace them with the sponsoring
          department or organisation's official channels.
        </InlineDemoNote>
      </div>
    </div>
  );
}
