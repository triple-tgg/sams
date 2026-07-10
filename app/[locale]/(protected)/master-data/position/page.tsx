import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PositionPage = () => {
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Position</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Position management page.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default PositionPage;
