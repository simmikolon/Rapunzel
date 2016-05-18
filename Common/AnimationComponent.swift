//
//  AnimationComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

//import UIKit
import SpriteKit
import GameplayKit

enum AnimationState: String {
    case Standard = "Standard"
}

struct Animation {
    
    //let animationName: String
    let textures: [SKTexture]
    let repeatTexturesForever: Bool
}

class AnimationComponent: GKComponent {
    
    static let textureActionKey = "textureAction"
    
    static let timePerFrame = NSTimeInterval(1.0 / 10.0)
    
    // MARK: Properties
    
    var requestedAnimation: String?
    
    let node: SKSpriteNode
    
    var animations: [String: Animation]
    
    private(set) var currentAnimation: Animation?
    
    // MARK: Initializers
    
    init(textureSize: CGSize, animations: [String: Animation]) {
        
        node = SKSpriteNode(texture: nil, size: textureSize)
        self.animations = animations
    }
    
    // MARK: Character Animation
    
    private func runAnimationForAnimationState(animationState: String, deltaTime: NSTimeInterval) {

        guard let animation = animations[animationState] else {
            
            fatalError("Unknown animation for state \(animationState)")
        }
        
        node.removeActionForKey(AnimationComponent.textureActionKey)
        
        let texturesAction: SKAction
        
        if animation.textures.count == 1 {
            
            texturesAction = SKAction.setTexture(animation.textures.first!)
            
        } else {
            
            if animation.repeatTexturesForever {
                
                texturesAction = SKAction.repeatActionForever(SKAction.animateWithTextures(animation.textures, timePerFrame: AnimationComponent.timePerFrame))
                
            } else {
                
                texturesAction = SKAction.animateWithTextures(animation.textures, timePerFrame: AnimationComponent.timePerFrame)
            }

        }
        
        node.runAction(texturesAction, withKey: AnimationComponent.textureActionKey)
        
        currentAnimation = animation
    }
    
    // MARK: GKComponent Life Cycle
    
    override func updateWithDeltaTime(deltaTime: NSTimeInterval) {
        
        super.updateWithDeltaTime(deltaTime)
        
        if let animationName = requestedAnimation {

            runAnimationForAnimationState(animationName, deltaTime: deltaTime)
            requestedAnimation = nil
        }
    }
    
}

extension AnimationComponent {
    
    class func animationsFromAtlas(atlas: SKTextureAtlas, repeatTexturesForever: Bool = false, playBackwards: Bool = false) -> Animation {
        
        var textures = [SKTexture]()
        
        let sortedTextureNames = atlas.textureNames.sort { $0 < $1 }
        
        for textureName: String in sortedTextureNames {
            textures.append(atlas.textureNamed(textureName))
            print(textureName)
        }
        
        let animation = Animation(
            
            //animationName: animationName,
            textures: textures,
            repeatTexturesForever: repeatTexturesForever
        )
        
        return animation
    }
}
