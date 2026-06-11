import { notFound } from "next/navigation";
import { ImmigrationProgramContent } from "@/components/public/immigration-program-content";
import {
  findImmigrationProgram,
  immigrationPrograms
} from "@/lib/immigration/programs";

type PageProps = {
  params: Promise<{ program: string }>;
};

export function generateStaticParams() {
  return immigrationPrograms.map((program) => ({ program: program.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { program } = await params;
  const data = findImmigrationProgram(program);

  return {
    title: data ? "Immigration Program" : "Immigration Services"
  };
}

export default async function ImmigrationProgramPage({ params }: PageProps) {
  const { program } = await params;
  const data = findImmigrationProgram(program);

  if (!data) {
    notFound();
  }

  return <ImmigrationProgramContent program={data} />;
}
