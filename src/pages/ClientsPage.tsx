import type { Client } from "../types";

export default function ClientsPage({ clients }: { clients: Client[] }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2 className="panelTitle">Clients</h2>
        <button className="primaryButton">New Client</button>
      </div>

      <div className="responsiveTableWrap">
        <table className="dataTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.firstName} {client.lastName}</td>
                <td>{client.phone}</td>
                <td>{client.email}</td>
                <td>{client.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
