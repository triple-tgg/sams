import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DepartmentPage = () => {
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Department</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Department management page.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default DepartmentPage;
