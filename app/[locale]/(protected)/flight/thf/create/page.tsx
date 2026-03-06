import StepForm from "./components/step-form";

const SinglePage = async () => {

  // if (!project) return <Alert color="destructive"> project id is not valid</Alert>
  return (
    <div className="space-y-5">
      <StepForm />
    </div>
  )
}

export default SinglePage