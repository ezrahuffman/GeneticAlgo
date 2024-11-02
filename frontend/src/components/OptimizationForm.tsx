import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";

const OptimizationForm = ({ onSubmit, isRunning }) => {
  const [formData, setFormData] = useState({
    problem_type: 'tsp',
    population_size: 50,
    dimension: 10,
    mutation_rate: 0.5,
    crossover_rate: 0.8,
    max_generations: 100,
    parameters: {
      cities: [
        [0, 0],
        [1, 3],
        [2, 1],
        [3, 9],
        [5, 3],
      ]
    }
  });

  const handleCityChange = (index, coord, value) => {
    const newCities = [...formData.parameters.cities];
    newCities[index][coord] = Number(value);
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        cities: newCities
      }
    });
  };

  const addCity = () => {
    const newCities = [...formData.parameters.cities, [0, 0]];
    setFormData({
      ...formData,
      dimension: newCities.length,
      parameters: {
        ...formData.parameters,
        cities: newCities
      }
    });
  };

  const removeCity = (index) => {
    const newCities = formData.parameters.cities.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      dimension: newCities.length,
      parameters: {
        ...formData.parameters,
        cities: newCities
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimization Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <FormItem>
              <FormLabel>Population Size</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={formData.population_size}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    population_size: Number(e.target.value) 
                  })}
                  className="w-full"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>
                Mutation Rate ({(formData.mutation_rate * 100).toFixed(1)}%)
              </FormLabel>
              <FormControl>
                <Slider
                  value={[formData.mutation_rate * 100]}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    mutation_rate: value[0] / 100 
                  })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>
                Crossover Rate ({(formData.crossover_rate * 100).toFixed(1)}%)
              </FormLabel>
              <FormControl>
                <Slider
                  value={[formData.crossover_rate * 100]}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    crossover_rate: value[0] / 100 
                  })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Max Generations</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={formData.max_generations}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_generations: Number(e.target.value) 
                  })}
                  className="w-full"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Cities</FormLabel>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>X</TableHead>
                      <TableHead>Y</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.parameters.cities.map((city, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            type="number"
                            value={city[0]}
                            onChange={(e) => handleCityChange(index, 0, e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={city[1]}
                            onChange={(e) => handleCityChange(index, 1, e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCity(index)}
                            disabled={formData.parameters.cities.length <= 3}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCity}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add City
              </Button>
            </FormItem>
          </div>

          <Button 
            type="submit" 
            disabled={isRunning}
            className="w-full"
          >
            Start Optimization
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OptimizationForm;