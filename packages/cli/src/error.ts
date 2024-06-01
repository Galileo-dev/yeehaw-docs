export function formatValidationErrors(error: any) {
  error = JSON.parse(error);
  if (error.type === "validation" && error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    if (firstError.schema && firstError.schema.description) {
      return firstError.schema.description;
    }
    return firstError.message;
  }
  return error;
}
