import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";
import axios from "axios";
import socket from "../src/services/socket";

const initialRoles = ["Manager", "Team Lead", "Engineer", "QA"];
const steps = [
  { id: 1, role: "Manager", status: "done" },
  { id: 2, role: "Team Lead", status: "current" },
  { id: 3, role: "Engineer", status: "pending" },
  { id: 4, role: "QA", status: "pending" },
];

const getStatusColor = (status) => {
  switch (status) {
    case "done":
      return "bg-green-500";
    case "current":
      return "bg-yellow-400 animate-pulse";
    case "pending":
      return "bg-gray-300";
    case "rejected":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
};

export default function WorkflowBuilder({ instanceId }) {
  const [roles, setRoles] = useState(initialRoles);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updateSignal, setUpdateSignal] = useState(0);

  const currentStep = steps.find((step) => step.status === "current");

  useEffect(() => {
    const handleUpdate = () => setUpdateSignal(Date.now());
    socket.on("update", handleUpdate);
    return () => socket.off("update", handleUpdate);
  }, []);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await axios.post(`/api/instances/${instanceId}/approve`, {
        role: currentStep?.role,
      });
      alert("Approved!");
      setFeedback("");
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await axios.post(`/api/instances/${instanceId}/reject`, {
        role: currentStep?.role,
        feedback,
      });
      alert("Rejected with feedback: " + feedback);
      setFeedback("");
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("Failed to reject");
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newRoles = Array.from(roles);
    const [moved] = newRoles.splice(result.source.index, 1);
    newRoles.splice(result.destination.index, 0, moved);
    setRoles(newRoles);
  };

  const saveWorkflow = async () => {
    setIsLoading(true);
    try {
      await axios.post(`/api/templates`, { roles });
      alert("Workflow saved!");
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert("Failed to save workflow");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <h1 className="text-4xl font-bold text-center text-primary mb-6">
        Workflow Approval Dashboard
      </h1>

      <div className="flex gap-2 items-center mb-6 relative">
        {steps.map((step, index) => (
          <div key={index} className="relative flex-1">
            <div className={`h-3 rounded ${getStatusColor(step.status)}`}></div>
            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
              {step.role}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-base-100 shadow-lg p-6 rounded-xl border border-base-200">
        <h2 className="text-xl font-semibold mb-4">Active Workflow Step</h2>
        <div className="flex justify-between mb-4">
          <p className="badge badge-primary">Role: {currentStep?.role}</p>
          <p className="badge badge-outline">Status: {currentStep?.status}</p>
        </div>

        <div className="mt-4 space-y-1 text-sm">
          <p>
            <strong>Condition:</strong> Budget Approval Required
          </p>
          <p>
            <strong>Data:</strong> Budget = $10,000
          </p>
        </div>

        <textarea
          className="textarea textarea-bordered w-full mt-4"
          placeholder="Add feedback if rejecting..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        ></textarea>

        <div className="flex gap-4 mt-6 justify-center">
          <button
            onClick={handleApprove}
            className="btn btn-success w-32"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <>
                <CheckIcon className="w-5 h-5 mr-2" /> Approve
              </>
            )}
          </button>
          <button
            onClick={handleReject}
            className="btn btn-error w-32"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <>
                <XMarkIcon className="w-5 h-5 mr-2" /> Reject
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-base-100 shadow-lg p-6 rounded-xl border border-base-200">
        <h2 className="text-xl font-semibold mb-4">Workflow Builder</h2>
        <p className="text-sm text-gray-500 mb-2">Drag to reorder roles</p>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="roles">
            {(provided) => (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {roles.map((role, index) => (
                  <Draggable key={role} draggableId={role} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-4 border rounded-lg bg-base-200 text-center transition-all duration-300 ${
                          snapshot.isDragging
                            ? "bg-primary text-white shadow-xl"
                            : ""
                        }`}
                      >
                        {role}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <button
          onClick={saveWorkflow}
          className="btn btn-primary mt-6 w-full sm:w-auto"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Save Workflow"
          )}
        </button>
      </div>
    </div>
  );
}
