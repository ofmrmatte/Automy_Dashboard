import { useState, type FormEvent } from "react";

import { Button, Field, Input, Select, Textarea } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";

const INITIAL_STATE = {
  name: "",
  company: "",
  email: "",
  phone: "",
  size: "1-10",
  message: "",
};

export function LeadForm() {
  const [form, setForm] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    window.setTimeout(() => {
      setSubmitting(false);
      setForm(INITIAL_STATE);
      toast.success("Contato registrado. Nosso time responde em até 1 dia útil.");
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome">
        <Input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Seu nome"
        />
      </Field>
      <Field label="Empresa">
        <Input
          required
          value={form.company}
          onChange={(event) => setForm({ ...form, company: event.target.value })}
          placeholder="Nome da transportadora"
        />
      </Field>
      <Field label="E-mail corporativo">
        <Input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="voce@empresa.com.br"
        />
      </Field>
      <Field label="Telefone">
        <Input
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          placeholder="(00) 00000-0000"
        />
      </Field>
      <Field label="Tamanho da operação">
        <Select
          value={form.size}
          onChange={(event) => setForm({ ...form, size: event.target.value })}
        >
          <option value="1-10">1 a 10 colaboradores</option>
          <option value="11-50">11 a 50 colaboradores</option>
          <option value="51-200">51 a 200 colaboradores</option>
          <option value="200+">Mais de 200 colaboradores</option>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Como podemos ajudar?">
          <Textarea
            rows={4}
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Conte rapidamente sobre sua operação atual."
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          Quero uma demonstração
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Ao enviar, você concorda em receber contato comercial da Automy.
        </p>
      </div>
    </form>
  );
}
