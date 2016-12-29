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
    
    static let timePerFrame = TimeInterval(1.0 / 10.0)
    
    // MARK: Properties
    
    var requestedAnimation: String?
    
    let node: SKSpriteNode
    
    var animations: [String: Animation]
    
    fileprivate(set) var currentAnimation: Animation?
    
    // MARK: Initializers
    
    init(textureSize: CGSize, animations: [String: Animation]) {
        
        node = SKSpriteNode(texture: nil, size: textureSize)
        self.animations = animations
        
        super.init()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: Character Animation
    
    fileprivate func runAnimationForAnimationState(_ animationState: String, deltaTime: TimeInterval) {

        guard let animation = animations[animationState] else {
            
            fatalError("Unknown animation for state \(animationState)")
        }
        
        node.removeAction(forKey: AnimationComponent.textureActionKey)
        
        let texturesAction: SKAction
        
        if animation.textures.count == 1 {
            
            texturesAction = SKAction.setTexture(animation.textures.first!)
            
        } else {
            
            if animation.repeatTexturesForever {
                
                texturesAction = SKAction.repeatForever(SKAction.animate(with: animation.textures, timePerFrame: AnimationComponent.timePerFrame))
                
            } else {
                
                texturesAction = SKAction.animate(with: animation.textures, timePerFrame: AnimationComponent.timePerFrame)
            }

        }
        
        node.run(texturesAction, withKey: AnimationComponent.textureActionKey)
        
        currentAnimation = animation
    }
    
    // MARK: GKComponent Life Cycle
    
    override func update(deltaTime: TimeInterval) {
        
        super.update(deltaTime: deltaTime)
        
        if let animationName = requestedAnimation {

            runAnimationForAnimationState(animationName, deltaTime: deltaTime)
            requestedAnimation = nil
        }
    }
    
}

extension AnimationComponent {
    
    class func animationsFromAtlas(_ atlas: SKTextureAtlas, repeatTexturesForever: Bool = false, playBackwards: Bool = false) -> Animation {
        
        var textures = [SKTexture]()
        
        let sortedTextureNames = atlas.textureNames.sorted { $0 < $1 }
        
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
