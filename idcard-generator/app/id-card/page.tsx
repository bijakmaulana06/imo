import IdCardGenerator from '@/components/IdCardGenerator';

export default function IdCardPage() {
  return (
    <main className="min-h-screen bg-white">
      <h1 className="mx-auto max-w-4xl px-4 pt-8 text-xl font-semibold text-neutral-900">
        Generator ID Card
      </h1>
      {/* Ganti dengan URL template .psd yang sudah diunggah admin,
          contoh: file di public/templates/, atau URL Supabase Storage. */}
      <IdCardGenerator templateUrl="/templates/id-card.psd" />
    </main>
  );
}
