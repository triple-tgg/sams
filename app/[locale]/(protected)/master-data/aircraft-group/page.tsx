import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AircraftGroupPage = () => {
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Aircraft Group</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Aircraft Group management page.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AircraftGroupPage;
