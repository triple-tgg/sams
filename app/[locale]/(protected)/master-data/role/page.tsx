import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const RolePage = () => {
    const t = useTranslations("Menu");
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{t("role")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Role management page content will be displayed here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default RolePage;
