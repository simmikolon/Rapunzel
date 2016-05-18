//
//  PlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import GameplayKit
import SpriteKit

enum PlatformAnimationName: String {
    
    case Normal = "PlatformNormal"
    case JumpingOn = "PlatformJumpingOn"
    case JumpingOff = "PlatformJumpingOff"
    case BottomHit = "PlatformBottomHit"
}

protocol PlatformEntityDelegate: class {
    func didRemovePlatform(platform: PlatformEntity)
}

class PlatformEntity: Entity, ContactNotifiableType, LifecycleComponentDelegate {
    
    static var textureSize = CGSize(width: 444, height: 132)
    
    /* Our Delegate who needs to know whenever a Platform Entity has left the screen */
    
    weak var delegate: PlatformEntityDelegate?
    
    // MARK: Components
    
    let renderComponent: RenderComponent
    let physicsComponent: PhysicsComponent
    var stateMachineComponent: StateMachineComponent!
    let animationComponent: AnimationComponent
    
    // MARK: Platform Configuration Variables
    
    var breakable: Bool
    var bottomCollidable: Bool
    
    // MARK: Initialisation
    
    init(isBreakable breakable: Bool = false, isBottomCollidable bottomCollidable: Bool = false, animations: [String: Animation]) {
        
        /* Platform Configuration */
        
        self.breakable = breakable
        self.bottomCollidable = bottomCollidable
        
        /* Create Render Component */
        
        renderComponent = RenderComponent()

        /* Chose Collider Type based on self.bottomCollidable & create Physics Component */
        
        let colliderType: ColliderType = (self.bottomCollidable) ? .BottomCollidablePlatform : .NormalPlatform
        physicsComponent = PhysicsComponent(physicsBody: SKPhysicsBody(rectangleOfSize: CGSize(width: 444, height: 132)), colliderType: colliderType)
        
        /* Create Animation Component and take over the animations from self.init( . . .) */
        
        animationComponent = AnimationComponent(textureSize: PlatformEntity.textureSize, animations: animations)
        
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
        
        animationComponent.requestedAnimation = PlatformAnimationName.Normal.rawValue
        
        /* Initialization of the default classes State Machine Component and GKState Subclasses  */
        /* We need to carry over self into our State Machine Component so we need to Initialize this after calling super.init() */
        /* Since .stateMachineComponent being an optional we can Subclass PlatformEntity and assign a different State Machine */
        /* Doing this we can define individual States for individual Subclasses. */
        /* Assigning has to be done in Subclass and will override defaulted forcing defaulted to be released */
        
        stateMachineComponent = StateMachineComponent(states: [
            
            /* Creation of GKSate Subclasses for this Entity */
            
            PlatformNormalState(entity: self),
            PlatformJumpingOnState(entity: self),
            PlatformJumpingOffState(entity: self),
            PlatformBottomHitState(entity: self),
            PlatformBreakingState(entity: self)
            
            ])
        
        /* Setting up the initial State this Entity will be in after Initialization */
        
        stateMachineComponent.enterInitialState()
        
        /* All Components have to be added to this Entity */
        
        addComponent(physicsComponent)
        addComponent(renderComponent)
        addComponent(animationComponent)
        addComponent(stateMachineComponent)
        
        /* Lifecycle Component */
        
        let lifecycleComponent = LifecycleComponent(withEntity: self, delegate: self)
        addComponent(lifecycleComponent)
    }
    
    // MARK: Management Functions
    
    func remove() {
        
        /* Removing all Actions, Nodes, Children and so on ... */
        
        self.animationComponent.node.removeFromParent()
        
        self.renderComponent.node.removeAllActions()
        self.renderComponent.node.removeAllChildren()
        self.renderComponent.node.removeFromParent()
        
        /* Remove all Components assigned to this Entity */
        
        //self.removeComponentForClass(RenderComponent)
        //self.removeComponentForClass(PhysicsComponent)
        //self.removeComponentForClass(AnimationComponent)
        //self.removeComponentForClass(StateMachineComponent)
        
        /* Inform Delegate that this Entity has just left */
        
        if let delegate = self.delegate {
            delegate.didRemovePlatform(self)
        }
    }

    // MARK: Deinitialization
    
    deinit {
        
        /* Debug Output to see if Entity was deallocated properly */
        print("Deinitialization: \(self.dynamicType)")
    }
    
    // MARK: - LifecycleComponent
    
    func nodeDidExitScreen(node node: SKNode) {
        
        remove()
    }
}

extension PlatformEntity {
    
    /* Forwarding Collision Even into State Machine Component */
    
    func contactWithEntityDidBegin(entity: GKEntity) {
        
        stateMachineComponent.contactWithEntityDidBegin(entity)
    }
    
    func contactWithEntityDidEnd(entity: GKEntity) {
        
        stateMachineComponent.contactWithEntityDidEnd(entity)
    }
}
