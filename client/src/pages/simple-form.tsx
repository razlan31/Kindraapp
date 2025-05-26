import { useState } from 'react';
import { useLocation } from 'wouter';

export default function SimpleForm() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const name = formData.get('name') as string;
    const relationshipStage = formData.get('relationshipStage') as string;

    if (!name || !relationshipStage) {
      alert('Please fill in name and relationship stage');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          relationshipStage
        }),
      });

      if (response.ok) {
        alert('Connection created successfully!');
        setLocation('/connections');
      } else {
        alert('Failed to create connection');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating connection');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Create Connection</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label htmlFor="relationshipStage" className="block text-sm font-medium mb-2">
              Relationship Stage *
            </label>
            <select
              id="relationshipStage"
              name="relationshipStage"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select relationship stage</option>
              <option value="Talking">Talking</option>
              <option value="Situationship">Situationship</option>
              <option value="FWB">FWB</option>
              <option value="Exclusive">Exclusive</option>
              <option value="Sneaky Link">Sneaky Link</option>
              <option value="Best Friend">Best Friend</option>
              <option value="Potential">Potential</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Connection'}
          </button>
        </form>

        <button
          onClick={() => setLocation('/connections')}
          className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}