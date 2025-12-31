import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const UserLoginPage = () => {
    const t = useTranslations("Menu");
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{t("user-login")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        User Login management page content will be displayed here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserLoginPage;
