import { HttpClient } from '@angular/common/http';
import {
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import {
  fetchAuthSession,
  signInWithRedirect,
} from 'aws-amplify/auth';

type PrestamoConLibro = {
  id: number;
  desde: string;
  hasta: string;
  devuelto: boolean;
  libro: {
    id: number;
    titulo: string;
    autor: string;
  };
};

/**
 * El cascarón: la barra de navegación y el hueco donde el router pone la
 * página. No sabe nada de autenticación, y en el tramo 8 va a saber lo
 * mínimo.
 *
 * 🔨 Tramo 8.8 y 8.10 · lo que te falta acá. Cuando tengas sesión, este
 * componente es el que lee `cognito:groups` y decide qué mostrar.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected esBibliotecario = signal(false);

  // Tramo 8.2: cliente HTTP y estado del panel.
  private readonly http = inject(HttpClient);
  readonly panel = signal<PrestamoConLibro[]>([]);
  readonly cargando = signal(false);

  protected async entrar(): Promise<void> {
    await signInWithRedirect();
  }

  protected async cargarRol(): Promise<void> {
    try {
      const { tokens } = await fetchAuthSession();

      const grupos = (
        tokens?.accessToken?.payload['cognito:groups'] ?? []
      ) as string[];

      this.esBibliotecario.set(
        grupos.includes('bibliotecarios'),
      );
    } catch {
      this.esBibliotecario.set(false);
    }
  }

  cargarPanel(): void {
    this.cargando.set(true);

    this.http
      .get<{ prestamos: PrestamoConLibro[] }>(
        'http://localhost:8080/v1/panel',
      )
      .subscribe({
        next: (respuesta) => {
          this.panel.set(respuesta.prestamos);
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('el panel fallo:', error.status, error.error);
          this.cargando.set(false);
        },
      });
  }

  constructor() {
    void this.cargarRol();
  }
}