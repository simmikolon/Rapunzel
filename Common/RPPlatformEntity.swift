//
//  RPPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import GameplayKit
import SpriteKit

enum RPPlatformAnimationName: String {
    
    case Normal = "RPPlatformNormal"
    case JumpingOn = "RPPlatformJumpingOn"
    case JumpingOff = "RPPlatformJumpingOff"
    case BottomHit = "RPPlatformBottomHit"
}

protocol RPPlatformEntityDelegate: class {
    func didRemovePlatform(platform: RPPlatformEntity)
}

class RPPlatformEntity: RPEntity, ContactNotifiableType {
    
    static var textureSize = CGSize(width: 444, height: 132)
    
    /* Our Delegate who needs to know whenever a Platform Entity has left the screen */
    
    weak var delegate: RPPlatformEntityDelegate?
    
    // MARK: Components
    
    let renderComponent: RPRenderComponent
    let physicsComponent: RPPhysicsComponent
    var stateMachineComponent: RPStateMachineComponent!
    let animationComponent: RPAnimationComponent
    
    // MARK: Platform Configuration Variables
    
    var breakable: Bool
    var bottomCollidable: Bool
    
    // MARK: Initialisation
    
    init(isBreakable breakable: Bool = false, isBottomCollidable bottomCollidable: Bool = false, animations: [String: RPAnimation]) {
        
        /* Platform Configuration */
        
        self.breakable = breakable
        self.bottomCollidable = bottomCollidable
        
        /* Create Render Component */
        
        renderComponent = RPRenderComponent()

        /* Chose Collider Type based on self.bottomCollidable & create Physics Component */
        
        let colliderType: RPColliderType = (self.bottomCollidable) ? .BottomCollidablePlatform : .NormalPlatform
        physicsComponent = RPPhysicsComponent(physicsBody: SKPhysicsBody(rectangleOfSize: CGSize(width: 444, height: 132)), colliderType: colliderType)
        
        /* Create Animation Component and take over the animations from self.init( . . .) */
        
        animationComponent = RPAnimationComponent(textureSize: RPPlatformEntity.textureSize, animations: animations)
        
        /* Add the Animation Components Node to the Render Components Node */
        
        renderComponent.addChild(animationComponent.node)
        
        /* We are ready to call super.init() */
        
        super.init()
        
        /* Set up all those things for which we need taking over self as a reference */
        
        /* Assign self to the Render Components Node Entity-Property. */
        /* Used among others for Collision Detection to forward Collision into this Entity */
        
        renderComponent.node.entity = self;
        
        /* Assign the Phyiscs Components Physicsbody to the Render Components Node */
        
        renderComponent.node.physicsBody = physicsComponent.physicsBody
        
        /* Set the initial Animation */
        
        animationComponent.requestedAnimation = RPPlatformAnimationName.Normal.rawValue
        
        /* Initialization of the default classes State Machine Component and GKState Subclasses  */
        /* We need to carry over self into our State Machine Component so we need to Initialize this after calling super.init() */
        /* Since .stateMachineComponent being an optional we can Subclass RPPlatformEntity and assign a different State Machine */
        /* Doing this we can define individual States for individual Subclasses. */
        /* Assigning has to be done in Subclass and will override defaulted forcing defaulted to be released */
        
        stateMachineComponent = RPStateMachineComponent(states: [
            
            /* Creation of GKSate Subclasses for this Entity */
            
            RPPlatformNormalState(entity: self),
            RPPlatformJumpingOnState(entity: self),
            RPPlatformJumpingOffState(entity: self),
            RPPlatformBottomHitState(entity: self),
            RPPlatformBreakingState(entity: self)
            
            ])
        
        /* Setting up the initial State this Entity will be in after Initialization */
        
        stateMachineComponent.enterInitialState()
        
        /* All Components have to be added to this Entity */
        
        addComponent(physicsComponent)
        addComponent(renderComponent)
        addComponent(animationComponent)
        addComponent(stateMachineComponent)
    }
    
    // MARK: Management Functions
    
    func remove() {
        
        /* Removing all Actions, Nodes, Children and so on ... */
        
        self.animationComponent.node.removeFromParent()
        
        self.renderComponent.node.removeAllActions()
        self.renderComponent.node.removeAllChildren()
        self.renderComponent.node.removeFromParent()
        
        /* Remove all Components assigned to this Entity */
        
        self.removeComponentForClass(RPRenderComponent)
        self.removeComponentForClass(RPPhysicsComponent)
        self.removeComponentForClass(RPAnimationComponent)
        self.removeComponentForClass(RPStateMachineComponent)
        
        /* Inform Delegate that this Entity has just left */
        
        guard let delegate = self.delegate else { fatalError("No Delegate Set!") }

        delegate.didRemovePlatform(self)
    }

    // MARK: Deinitialization
    
    deinit {
        
        /* Debug Output to see if Entity was deallocated properly */
        print("Deinitialization: \(self.dynamicType)")
    }
    
    // MARK: Prototyping Stuff
    
    /* Prototyping Stuff */
    
    /*
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        if let positionInScene = renderComponent.node.scene?.convertPoint(renderComponent.node.position, fromNode: renderComponent.node.parent!) {
        
            if positionInScene.y < -(renderComponent.node.scene!.size.height / 2) {
                
                remove()
            }
        }
    }
    */
}

extension RPPlatformEntity {
    
    /* Forwarding Collision Even into State Machine Component */
    
    func contactWithEntityDidBegin(entity: GKEntity) {
        
        stateMachineComponent.contactWithEntityDidBegin(entity)
    }
    
    func contactWithEntityDidEnd(entity: GKEntity) {
        
        stateMachineComponent.contactWithEntityDidEnd(entity)
    }
}
