import { useParams } from "react-router";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  return <main>products/{id}</main>;
}
